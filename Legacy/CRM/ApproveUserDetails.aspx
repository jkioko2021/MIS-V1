<%@ Page Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="ApproveUserDetails.aspx.vb" Inherits="ApproveUserDetails" title="Systems User Approvals" %>
<%@ OutputCache  Location ="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <script type ="text/javascript" >
function SelectAllCheckboxes(spanChk){

// Added as ASPX uses SPAN for checkbox
var oItem = spanChk.children;
var theBox=(spanChk.type=="checkbox")?spanChk:spanChk.children.item[0];
xState=theBox.checked;

elm=theBox.form.elements;
for(i=0;i<elm.length;i++)
if(elm[i].type=="checkbox" && elm[i].id!=theBox.id)
{
//elm[i].click();
if(elm[i].checked!=xState)
elm[i].click();


//elm[i].checked=xState;
}
}
</script>        
    
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
            <img src="Images/ajax-loader1.gif" />
            <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="#153E7E" Text="Please Wait...."></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
<TABLE style="WIDTH: 612px"><TBODY><TR><TD colSpan=3>
    ________________________________________________________________________________________________________________________</TD></TR><TR><TD colSpan=3><asp:Button id="CmdApprovalList" onclick="CmdApprovalList_Click" runat="server" Width="176px" Text="Awaiting Approval List" ForeColor="White" BackColor="Gray" CausesValidation="False" BorderStyle="Outset" BorderColor="Silver"></asp:Button><asp:Button id="CmdClientDetails" onclick="CmdClientDetails_Click" runat="server" Width="192px" Text="User Details" ForeColor="White" BackColor="Gray" CausesValidation="False" BorderStyle="Outset" BorderColor="Silver"></asp:Button></TD></TR><TR><TD colSpan=3><asp:MultiView id="MultiView1" runat="server"><asp:View id="View1" runat="server"><TABLE style="WIDTH: 632px; border-right: black 1px solid; border-top: black 1px solid; border-left: black 1px solid; border-bottom: black 1px solid;"><TBODY><TR><TD style="HEIGHT: 26px" align=right colSpan=3><cc1:ConfirmButtonExtender id="ConfirmButtonExtender1" runat="server" ConfirmText="Are Sure You want to Approve?" TargetControlID="CmdSave">
                                                </cc1:ConfirmButtonExtender> &nbsp;<asp:Button id="CmdSave" onclick="CmdSave_Click" runat="server" Width="83px" Text="Approve" Visible="False"></asp:Button></TD></TR><TR><TD align=right colSpan=3><asp:CheckBox id="CheckBox2" onclick="SelectAllCheckboxes(this)" runat="server" Width="149px" Text="Select All" ForeColor="#153E7E" Font-Bold="True" AutoPostBack="True" OnCheckedChanged="CheckBox2_CheckedChanged" Visible="False"></asp:CheckBox>&nbsp;</TD></TR><TR><TD colSpan=3><asp:GridView id="GridView1" runat="server" Width="712px" ForeColor="#333333" AllowPaging="True" AllowSorting="True" AutoGenerateColumns="False" CellPadding="4" DataKeyNames="EmployeeID" EmptyDataText="There are no data records to display." GridLines="None">
<RowStyle BackColor="#EFF3FB"></RowStyle>
<Columns>
<asp:BoundField DataField="EmployeeName" HeaderText="EmployeeName" SortExpression="EmployeeName">
<HeaderStyle HorizontalAlign="Left"></HeaderStyle>
</asp:BoundField>
<asp:BoundField DataField="UserName" HeaderText="UserName" SortExpression="UserName">
<HeaderStyle HorizontalAlign="Left"></HeaderStyle>
</asp:BoundField>
<asp:BoundField DataField="Title" HeaderText="Title" SortExpression="Title">
<HeaderStyle HorizontalAlign="Left"></HeaderStyle>
</asp:BoundField>

<asp:BoundField DataField="Email" HeaderText="Email" SortExpression="Email">
<HeaderStyle HorizontalAlign="Left"></HeaderStyle>
</asp:BoundField>
<asp:TemplateField><ItemTemplate>
<asp:LinkButton id="LinkButton1" runat="server" CommandName="Select1" CommandArgument='<%# eval("EmployeeID") %>'>View Details</asp:LinkButton> 
</ItemTemplate>
</asp:TemplateField>
<asp:TemplateField><ItemTemplate>
&nbsp;
</ItemTemplate>
</asp:TemplateField>
</Columns>

<FooterStyle BackColor="#507CD1" Font-Bold="True" ForeColor="White"></FooterStyle>

<PagerStyle HorizontalAlign="Center" BackColor="#2461BF" ForeColor="White"></PagerStyle>

<SelectedRowStyle BackColor="#D1DDF1" Font-Bold="True" ForeColor="#333333"></SelectedRowStyle>

<HeaderStyle BackColor="#507CD1" Font-Bold="True" ForeColor="White"></HeaderStyle>

<EditRowStyle BackColor="#2461BF"></EditRowStyle>

<AlternatingRowStyle BackColor="White"></AlternatingRowStyle>
</asp:GridView>&nbsp; </TD></TR><TR><TD><asp:Label id="Label3" runat="server" Width="432px" ForeColor="Red" Font-Bold="True"></asp:Label></TD><TD></TD><TD></TD></TR><TR><TD></TD><TD></TD><TD></TD></TR></TBODY></TABLE></asp:View> <asp:View id="View2" runat="server"><TABLE style="BORDER-RIGHT: black 1px solid; BORDER-TOP: black 1px solid; FONT-SIZE: 11px; BORDER-LEFT: black 1px solid; WIDTH: 91%; BORDER-BOTTOM: black 1px solid; FONT-FAMILY: Arial, Helvetica, sans-serif; HEIGHT: 232px; BACKGROUND-COLOR: #ffffff"><TBODY><TR>
                <TD style="FONT-WEIGHT: bold; COLOR: #153e7e; HEIGHT: 21px">Employee Name</TD>
                <TD style="WIDTH: 135px; HEIGHT: 26px">
                    <asp:TextBox id="txtEmployeeName" runat="server" Width="224px" ForeColor="#153E7E" BackColor="White" CssClass="tinyText" ValidationGroup="UserRegistration" ReadOnly="True"></asp:TextBox></TD>
                <TD style="HEIGHT: 26px"></TD></TR>
                <TR>
                    <td style="FONT-WEIGHT: bold; COLOR: #153e7e; HEIGHT: 21px">Title</td><TD style="WIDTH: 135px"><asp:TextBox id="txtTitle" runat="server" Width="224px" ForeColor="#153E7E" BackColor="White" CssClass="tinyText" ReadOnly="True"></asp:TextBox></TD><TD></TD></TR>
                <TR>
                    <TD style="FONT-WEIGHT: bold; COLOR: #153e7e; HEIGHT: 21px">Office Extension</TD><TD style="WIDTH: 135px"><asp:TextBox id="txtOfficeExt" runat="server" Width="224px" ForeColor="#153E7E" BackColor="White" CssClass="tinyText" ReadOnly="True"></asp:TextBox></TD>
                    <TD></TD></TR><TR>
                <TD style="FONT-WEIGHT: bold; COLOR: #153e7e; HEIGHT: 21px">CellPhone</TD><TD 
            style="WIDTH: 135px; HEIGHT: 21px"><asp:TextBox ID="txtCellPhone" 
            runat="server" BackColor="White" CssClass="tinyText" ForeColor="#153E7E" 
            ReadOnly="True" Width="224px"></asp:TextBox></TD>
                <TD style="HEIGHT: 21px"></TD></TR>
                <TR>
                    <TD style="FONT-WEIGHT: bold; COLOR: #153e7e; HEIGHT: 21px">Email</TD><TD style="WIDTH: 135px"><asp:TextBox id="txtEmail" runat="server" Width="224px" ForeColor="#153E7E" BackColor="White" CssClass="tinyText" ValidationGroup="UserRegistration" ReadOnly="True"></asp:TextBox></TD>
                    <TD></TD></TR><TR>
                <td style="FONT-WEIGHT: bold; COLOR: #153e7e; HEIGHT: 21px">Other Email</td><TD style="WIDTH: 135px"><asp:TextBox 
            ID="txtOtherEmail" runat="server" BackColor="White" CssClass="tinyText" 
            ForeColor="#153E7E" ReadOnly="True" ValidationGroup="UserRegistration" 
            Width="224px"></asp:TextBox></TD>
                <TD></TD></TR><TR>
                <TD style="FONT-WEIGHT: bold; COLOR: #153e7e; HEIGHT: 21px">User Name</TD><TD 
            style="width: 135px;"><asp:TextBox ID="txtUserName" runat="server" 
            BackColor="White" CssClass="tinyText" ForeColor="#153E7E" ReadOnly="True" 
            ValidationGroup="UserRegistration" Width="224px"></asp:TextBox></TD>
                <TD></TD></TR><tr>
                <td style="FONT-WEIGHT: bold; COLOR: #153e7e; HEIGHT: 21px">Profile Name</td><td 
                style="WIDTH: 135px"><asp:TextBox ID="txtProfile" runat="server" 
                BackColor="White" CssClass="tinyText" ForeColor="#153E7E" ReadOnly="True" 
                ValidationGroup="UserRegistration" Width="224px"></asp:TextBox></td>
                <td></td></tr>
    <TR>
        <TD style="FONT-WEIGHT: bold; COLOR: #153e7e; HEIGHT: 21px">
            Department</TD>
        <TD style="WIDTH: 135px">
            <asp:TextBox ID="txtdepart" runat="server" BackColor="White" 
            CssClass="tinyText" ForeColor="#153E7E" ReadOnly="True" 
            ValidationGroup="UserRegistration" Width="224px"></asp:TextBox>
        </TD>
        <TD>
            &nbsp;</TD>
    </TR>
    <TR><TD colspan="3">
        <asp:Label ID="Label4" runat="server" Font-Bold="True" Font-Size="Small" 
            ForeColor="Red" Width="684px"></asp:Label>
        </TD></TR><TR><TD style="FONT-WEIGHT: bold; COLOR: black; HEIGHT: 21px">NB: This may take a 
                    few seconds</TD><TD style="WIDTH: 135px">
                        <asp:Button ID="btnApprove" runat="server" 
            onclick="btnApprove_Click" Text="Approve" Width="79px" />
                    </TD>
                    <TD>
                    </TD>
                </TR><TR><td colspan="2">
                    <asp:CheckBox ID="chkUserLocked" runat="server" Enabled="False" 
                Font-Bold="True" Text="Account Locked" Visible="False" Width="211px"></asp:CheckBox></td><TD></TD></TR>
                <TR><TD style="HEIGHT: 26px" colSpan=2>
                    <asp:CheckBox id="chkAutomaticLock" runat="server" Width="280px" Text="Automatically lock an acount if not in use after" Font-Bold="True" Enabled="False" Visible="False"></asp:CheckBox>
                    </TD>
                    <TD style="COLOR: #153e7e; HEIGHT: 26px">
                        <asp:TextBox id="txtDaysToLockUser" runat="server" Width="46px" ForeColor="#153E7E" BackColor="White" CssClass="tinyText" ReadOnly="True" Visible="False">0</asp:TextBox>
                    </TD>
                </TR><TR><TD colspan="3"></TD></TR>
                <TR><TD style="HEIGHT: 44px">
                    <asp:HiddenField ID="HiddenField1" runat="server" />
                    <asp:Label ID="Label1" runat="server" ForeColor="#153E7E" 
            Width="152px"></asp:Label>
                    </TD>
                    <td style="WIDTH: 135px; HEIGHT: 44px">
                    </td>
                    <td style="HEIGHT: 44px">
                        <asp:Label ID="Label2" runat="server" ForeColor="#153E7E" Width="296px"></asp:Label>
                    </td>
                </TR><TR><TD colspan="3">&nbsp;</TD></TR>
                <tr>
                    <td>
                    </td>
                    <td style="WIDTH: 135px">
                    </td>
                    <td>
                    </td>
                </tr>
            </TBODY></TABLE></asp:View> </asp:MultiView></TD></TR><TR><TD></TD><TD></TD><TD></TD></TR></TBODY></TABLE>
</ContentTemplate>
    </asp:UpdatePanel>
</asp:Content>

