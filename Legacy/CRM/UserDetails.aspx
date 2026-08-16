<%@ Page Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false"
    CodeFile="UserDetails.aspx.vb" Inherits="UserDetails" Title="System User Details" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register Assembly="Telerik.Web.UI" Namespace="Telerik.Web.UI" TagPrefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
            <img src="Images/ajax-loader1.gif" />
            <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="#153E7E" Text="Please Wait...."></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
        <div id="#Master_div">
            <table style="width: 90%">
                <tbody>
                    <tr>
                        <td></td>
                    </tr>
                    <tr>
                        <td>
                            <asp:Label ID="Label180" runat="server" Text="SYSTEM USER CAPTURE" CssClass="tablestyle" Font-Bold="True" Font-Size="Large"></asp:Label>
                        </td>
                    </tr>
                    <tr>
                        <td></td>
                    </tr>
                    <tr>
                        <td>
                            <hr style="border-color: blue;" />
                            <asp:Panel ID="Panel3" runat="server" CssClass="box1" Style="background-color: ButtonHighlight;
                            border: 0px; padding: 3px 5px 2px 5px;" Visible="False" Width="100%">
                            <asp:Label ID="LblErr" runat="server" Text="" ForeColor="Red" Font-Bold="true" Font-Size="Small"></asp:Label>
                        </asp:Panel>
                        <cc1:RoundedCornersExtender ID="RoundedCornersExtender1" runat="server" TargetControlID="Panel3"
                            Corners="All" BorderColor="BlueViolet">
                        </cc1:RoundedCornersExtender>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<telerik:RadButton ID="CmdClientRegistration" runat="server" Text="User Registration" Skin="Office2007"  CausesValidation="false">
                            </telerik:RadButton>
                            &nbsp;<telerik:RadButton ID="CmdClientSearch" runat="server" Text="Search" Skin="Office2007"   CausesValidation="false"></telerik:RadButton>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <asp:MultiView ID="MultiView1" runat="server">
                                <asp:View ID="View1" runat="server">
                                    <table style="border-style: solid; border-color: inherit; border-width: 1px; font-size: 11px; width: 74%; font-family: Arial, Helvetica, sans-serif;
                                        height: 100%; background-color: #ffffff">
                                        <tbody>
                                            <tr>
                                                <td style="height: 26px; width: 140px;">
                                                    <asp:LinkButton ID="LinkButton1" runat="server" CausesValidation="False" Font-Size="Small"
                                                        Width="136px">Add New </asp:LinkButton>
                                                </td>
                                                <td style="width: 1898px; height: 26px">
                                                </td>
                                                <td style="width: 299px; height: 26px">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="height: 10px">
                                                    Employee Name
                                                </td>
                                                <td style="width: 1898px; height: 10px;">
                                                    <asp:TextBox ID="txtEmployeeName" runat="server" BackColor="White" 
                                                        CssClass="tinyText" ForeColor="#153E7E" ValidationGroup="UserRegistration" 
                                                        Width="200px"></asp:TextBox>
                                                </td>
                                                <td>
                                                    <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" 
                                                        ControlToValidate="txtEmployeeName" EnableClientScript="False" 
                                                        ErrorMessage="Enter Employee Name" Font-Bold="True" Font-Size="XX-Large" 
                                                        Height="37px" ValidationGroup="UserRegistration" Width="6%">*</asp:RequiredFieldValidator>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    Title
                                                </td>
                                                <td style="width: 1898px">
                                                    <asp:TextBox ID="txtTitle" runat="server" BackColor="White" CssClass="tinyText" 
                                                        ForeColor="#153E7E" Width="200px"></asp:TextBox>
                                                </td>
                                                <td>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    Office Extension
                                                </td>
                                                <td style="width: 1898px">
                                                    <asp:TextBox ID="txtOfficeExt" runat="server" BackColor="White" CssClass="tinyText"
                                                        ForeColor="#153E7E" Width="200px"></asp:TextBox>
                                                </td>
                                                <td>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="height: 26px;">
                                                    CellPhone
                                                </td>
                                                <td style="height: 26px; width: 1898px;">
                                                    <asp:TextBox ID="txtCellPhone" runat="server" BackColor="White" CssClass="tinyText"
                                                        ForeColor="#153E7E" Width="200px"></asp:TextBox>
                                                </td>
                                                <td>
                                                    <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="txtEmail"
                                                        EnableClientScript="False" ErrorMessage="Enter valid Email Address" Font-Bold="True"
                                                        Font-Size="XX-Large" ValidationExpression="\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*"
                                                        ValidationGroup="UserRegistration" Width="18px" Height="29px">*</asp:RegularExpressionValidator>
                                                </td>
                                                <td style="width: 135px; height: 21px;">
                                                    &nbsp;
                                                </td>
                                                <td style="width: 299px; height: 21px">
                                                    &nbsp;
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="5" style="height: 26px;">
                                                <hr />
                                                    <asp:CheckBox ID="chkAutomaticLock" runat="server" Font-Bold="True" ForeColor="#153E7E"
                                                        Text="Automatically lock an acount if not in use after" Visible="False" Width="280px" />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <telerik:RadButton ID="btnSendEmail" runat="server" Text="Resend Password Via E-Mail"  Visible="False"
                                                        Skin="Office2007">
                                                    </telerik:RadButton>
                                                </td>
                                                <td style="width: 1898px">
                                                    <asp:Label ID="Label5" runat="server" Text="NB: This may take a few seconds" Visible="False"
                                                        Width="200px"></asp:Label>
                                                </td>
                                                <td style="width: 299px;">
                                                </td>
                                                <td style="width: 299px;">
                                                    &nbsp;
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    User Name
                                                </td>
                                                <td style="width: 1898px">
                                                    <asp:TextBox ID="txtUserName" runat="server" BackColor="White"
                                                        ForeColor="#153E7E" ValidationGroup="UserRegistration" Width="200px"></asp:TextBox>
                                                </td>
                                                <td>
                                                    <asp:RequiredFieldValidator ID="RequiredFieldValidator11" runat="server" ControlToValidate="txtUserName"
                                                        EnableClientScript="False" ErrorMessage="Enter User Name" Font-Bold="True" 
                                                        ValidationGroup="UserRegistration" Width="20px">*</asp:RequiredFieldValidator>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    Email
                                                </td>
                                                <td style="width: 1898px">
                                                    <asp:TextBox ID="txtEmail" runat="server" BackColor="White" CssClass="tinyText" ForeColor="#153E7E"
                                                        ValidationGroup="UserRegistration" Width="200px"></asp:TextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    Other Email
                                                </td>
                                                <td style="width: 1898px">
                                                    <asp:TextBox ID="txtOtherEmail" runat="server" BackColor="White" CssClass="tinyText"
                                                        ForeColor="#153E7E" ValidationGroup="UserRegistration" Width="200px"></asp:TextBox>
                                                </td>
                                                <td>
                                                    <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="txtOtherEmail"
                                                        EnableClientScript="False" ErrorMessage="Enter valid Email Address" Font-Bold="True" ValidationExpression="\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*"
                                                        ValidationGroup="UserRegistration" Width="18px">*</asp:RegularExpressionValidator>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <asp:Label ID="Label3" runat="server" Text="Password"
                                                        Width="203px"></asp:Label>
                                                </td>
                                                <td style="width: 1898px">
                                                    <asp:TextBox ID="txtPassword" runat="server" Width="200px" TextMode="SingleLine" Enabled="false"></asp:TextBox>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label1" runat="server" Text="The system generates new password for new users."
                                                        Width="196px"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <asp:Label ID="Label8" runat="server" Text="Confirm Password" Visible="false"></asp:Label>
                                                </td>
                                                <td style="width: 1898px">
                                                    <asp:TextBox ID="txtPass" runat="server" CssClass="tinyManText" ValidationGroup="LoginControl" 
                                                        Width="216px" Skin="Office2007" TextMode="Password"></asp:TextBox>
                                                    <cc1:FilteredTextBoxExtender ID="txtPass_FilteredTextBoxExtender" 
                                                        runat="server" FilterType="Custom" InvalidChars="&lt;&gt;()" 
                                                        TargetControlID="txtPass" 
                                                        ValidChars="1234567890QWERTYUIOPASDFGHJKLZXCVBNM/qwertyuiopasdfghjklzxcvbnm*%$#@![]\^*">
                                                    </cc1:FilteredTextBoxExtender>
                                                </td>
                                                <td style="width: 299px;">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    &nbsp;</td>
                                                <td style="width: 1898px">
                                                    <asp:CheckBox ID="chkpolicy" runat="server" AutoPostBack="True" Checked="True" 
                                                        Enabled="False" OnCheckedChanged="CheckBox2_CheckedChanged" 
                                                        style="font-weight: 700; font-size: x-small" Text="Enforce Password Policy" 
                                                        Width="203px" />
                                                </td>
                                                <td style="width: 299px;">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="font-weight: bold; color: #153e7e; height: 3px;" colspan="3">
                                                    <asp:Label ID="Label6" runat="server" Width="463px" Font-Bold="True" ForeColor="#806517"></asp:Label>
                                                </td>
                                                <td style="width: 140px; font-weight: bold; color: #153e7e;">
                                                </td>
                                                <td>
                                                </td>
                                                <td>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <asp:CheckBox ID="chkUserLocked2" runat="server" Font-Bold="True" ForeColor="#153E7E"
                                                        Text="Account Locked" Width="211px" />
                                                </td>
                                                <td style="width: 1898px">
                                                    <asp:CheckBox ID="chkUserLocked" runat="server" Font-Bold="True" ForeColor="#153E7E"
                                                        Text="Account Locked" Visible="False" Width="211px" />
                                                </td>
                                                <td>
                                                    <asp:CheckBox ID="CheckBox2" runat="server" AutoPostBack="True" OnCheckedChanged="CheckBox2_CheckedChanged"
                                                        Text="Reset Password" Width="203px" />
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label7" runat="server" 
                                                        Text="NB: This is only for users who have been approved and not new users." 
                                                        Width="196px"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td style="width: 299px;">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="height: 31px">
                                                    Profile Name
                                                </td>
                                                <td style="height: 31px; width: 1898px;">
                                                    <telerik:RadComboBox ID="cboprofile" runat="server" Skin="Outlook" 
                                                        Width="250px" ValidationGroup="UserRegistration"> </telerik:RadComboBox>
                                                </td>
                                                <td style="height: 31px">
                                                    <asp:RequiredFieldValidator ID="RequiredFieldValidator12" runat="server" ControlToValidate="cboprofile"
                                                        EnableClientScript="False" ErrorMessage="Select a User Profile" Font-Bold="True"
                                                        Font-Size="XX-Large" ValidationGroup="UserRegistration" Width="20px">*</asp:RequiredFieldValidator>
                                                    &nbsp;
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    Department</td>
                                                <td style="width: 1898px">
                                                    <telerik:RadComboBox ID="cbodepart" runat="server" Skin="Outlook" Width="250px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" />
                                                            <telerik:RadComboBoxItem runat="server" Text="MEMBERSHIP" Value="MEMBERSHIP" />
                                                            <telerik:RadComboBoxItem runat="server" Text="CLAIMS" Value="CLAIMS" />
                                                            <telerik:RadComboBoxItem runat="server" Text="RETENTION" Value="RETENTION" />
                                                            <telerik:RadComboBoxItem runat="server" Text="CASE MANAGEMENT" 
                                                                Value="CASE MANAGEMENT" />
                                                            <telerik:RadComboBoxItem runat="server" Text="IT" Value="IT" />
                                                            <telerik:RadComboBoxItem runat="server" Text="FINANCE" Value="FINANCE" />
                                                            <telerik:RadComboBoxItem runat="server" Text="SALES &amp; MARKETING" 
                                                                Value="SALES &amp; MARKETING" />
                                                            <telerik:RadComboBoxItem runat="server" Text="CUSTOMER SERVICE" 
                                                                Value="CUSTOMER SERVICE" />
                                                            <telerik:RadComboBoxItem runat="server" Text="HR" Value="HR" />
                                                            <telerik:RadComboBoxItem runat="server" Text="FILING" Value="FILING" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="2">
                                                    <asp:CheckBox ID="CheckBox1" runat="server" AutoPostBack="True" Font-Bold="True"
                                                        ForeColor="#153E7E" Text="User enabled for entry deletion" Visible="False" Width="207px" />
                                                </td>
                                                <td style="width: 299px;">
                                                </td>
                                                <td style="width: 299px; height: 26px">
                                                    <asp:TextBox ID="txtDaysToLockUser" runat="server" BackColor="White" CssClass="tinyText"
                                                        ForeColor="#153E7E" Visible="False" Width="46px">0</asp:TextBox>
                                                    <strong style="font-weight: bold; color: #153e7e"></strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-weight: bold; color: #153e7e; height: 3px;" colspan="3">
                                                    
                                                </td>
                                                <td style="height: 18px;" colspan="3">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                </td>
                                                <td style="width: 1898px">
                                                    <telerik:RadButton ID="CmdSave" runat="server" Text="Save User" Skin="Office2007"
                                                        ValidationGroup="UserRegistration">
                                                    </telerik:RadButton>
                                                    <cc1:ConfirmButtonExtender ID="ConfirmButtonExtender1" runat="server" ConfirmText="Confirm the User Details captured?"
                                                        Enabled="True" TargetControlID="CmdSave"></cc1:ConfirmButtonExtender>
                                                    &nbsp;&nbsp;
                                                    <telerik:RadButton ID="Cancel" runat="server" Text="Cancel" Skin="Office2007">
                                                    </telerik:RadButton>
                                                </td>
                                                <td>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 140px;">
                                                    <asp:HiddenField ID="HiddenField1" runat="server" />
                                                </td>
                                                <td style="width: 1898px">
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label2" runat="server" Width="197px"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="3">
                                                    <asp:ValidationSummary ID="ValidationSummary1" runat="server" EnableClientScript="False"
                                                        
                                                        HeaderText="Ensure all Fields Marked with '**' have data Before Proceeding" Height="100%"
                                                        ValidationGroup="UserRegistration" Width="100%" />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 140px">
                                                </td>
                                                <td style="width: 1898px">
                                                </td>
                                                <td>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </asp:View>
                                <asp:View ID="View2" runat="server">
                                    <table style="border-right: 1px solid; border-top: 1px solid; font-size: 11px; border-left: 1px solid;
                                        width: 100%; border-bottom: 1px solid; font-family: Arial, Helvetica, sans-serif;
                                        height: 100%; background-color: #ffffff" align="left">
                                        <tbody>
                                            <tr>
                                                <td align="left">
                                                    &nbsp;
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="left" colspan="3">
                                                    <asp:Panel ID="Panel9" runat="server" Width="1246px">
                                                        <table>
                                                            <tr>
                                                                <td style="width: 200px">
                                                                    <asp:Label ID="Label77" runat="server" style="font-weight: 700" 
                                                                        Text="Search By"></asp:Label>
                                                                </td>
                                                                <td>
                                                                    <telerik:RadComboBox ID="cbosearch" Runat="server">
                                                                        <Items>
                                                                            <telerik:RadComboBoxItem runat="server" Text="Username" Value="U" />
                                                                            <telerik:RadComboBoxItem runat="server" Text="Name" Value="N" />
                                                                        </Items>
                                                                    </telerik:RadComboBox>
                                                                </td>
                                                                <td>
                                                                    <telerik:RadTextBox ID="txtsearch" Runat="server" Width="250px">
                                                                    </telerik:RadTextBox>
                                                                </td>
                                                                <td>
                                                                    <telerik:RadButton ID="SEARCH" runat="server" Text="Search">
                                                                    </telerik:RadButton>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="left" colspan="3">
                                                    <strong style="font-weight: bold; color: #806517">System Users Listing</strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="left" colspan="3" width="100%">
                                                    <asp:Panel ID="Panel4" runat="server" Height="300px" ScrollBars="Both" 
                                                        Width="100%">
                                                        <telerik:RadGrid ID="GDALLOC" runat="server" AllowPaging="True" CellSpacing="0" 
                                                            GridLines="None" Height="100%" Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="EmployeeID">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter ID column" HeaderText="Select" Text="Select" 
                                                                        UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                        <ItemStyle Width="100px" />
                                                                    </telerik:GridButtonColumn>
                                                                    <telerik:GridBoundColumn DataField="EmployeeID" 
                                                                        FilterControlAltText="Filter EmployeeID column" HeaderText="ID" 
                                                                        SortExpression="EmployeeID" UniqueName="EmployeeID">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="EmployeeName" 
                                                                        FilterControlAltText="Filter EmployeeName column" HeaderText="EmployeeName" 
                                                                        SortExpression="EmployeeName" UniqueName="EmployeeName">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Email" 
                                                                        FilterControlAltText="Filter Email column" HeaderText="Email" 
                                                                        SortExpression="Email" UniqueName="Email">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="UserName" 
                                                                        FilterControlAltText="Filter UserName column" HeaderText="UserName" 
                                                                        SortExpression="UserName" UniqueName="UserName">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Department" 
                                                                        FilterControlAltText="Filter Department column" HeaderText="Department" 
                                                                        SortExpression="Department" UniqueName="Department">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                        ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                        Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                        <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                        <ItemStyle CssClass="ButtonColumn" />
                                                                    </telerik:GridButtonColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="left">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td align="left">
                                                    <asp:Label ID="lblr" runat="server"></asp:Label>
                                                </td>
                                                <td>
                                                </td>
                                                <td>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </asp:View>
                            </asp:MultiView>
                        </td>
                    </tr>
                </tbody>
            </table>
            </div>
        </ContentTemplate>
    </asp:UpdatePanel>
</asp:Content>
