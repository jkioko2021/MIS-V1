<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Tracking_RM_Report.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                    
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                      <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" Width="1170px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="BUSINESS UPDATE STATUS VIEW" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td style="width: 1639px" align="right">
                                                    &nbsp;</td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 91px">
                                                    <asp:CheckBox ID="chkdate" runat="server" Text="By date" />
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    <asp:CheckBox ID="chkname" runat="server" Text="By Name" />
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td align="right" style="width: 1639px">
                                                    <asp:Label ID="Label141" runat="server" Text="Search by"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    <asp:Label ID="Label158" runat="server" Text="Name"></asp:Label>
                                                </td>
                                                <td colspan="2" style="width: 264px">
                                                    <telerik:RadComboBox ID="cboNAME" Runat="server" AllowCustomText="True" 
                                                        AutoPostBack="True" MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboNAME" Text="RM Name" 
                                                                Value="R" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboNAME" Text="Date Range" 
                                                                Value="D" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1639px">
                                                    &nbsp;</td>
                                                <td style="width: 125px">
                                                    <asp:Label ID="Label156" runat="server" Text="Date From"></asp:Label>
                                                </td>
                                                <td style="width: 264px" colspan="2">
                                                    <telerik:RadDatePicker ID="dtfrom" Runat="server" Skin="Sunset">
                                                        <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                            UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                        </Calendar>
                                                        <DateInput DateFormat="dd-MMM-yyyy" DisplayDateFormat="dd-MMM-yyyy">
                                                        </DateInput>
                                                        <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                    </telerik:RadDatePicker>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1639px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    <asp:Label ID="Label157" runat="server" Text="Date To"></asp:Label>
                                                </td>
                                                <td colspan="2" style="width: 264px">
                                                    <telerik:RadDatePicker ID="dtto" Runat="server" Skin="Sunset">
                                                        <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                            UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                        </Calendar>
                                                        <DateInput DateFormat="dd-MMM-yyyy" DisplayDateFormat="dd-MMM-yyyy">
                                                        </DateInput>
                                                        <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                    </telerik:RadDatePicker>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Skin="Simple" Text="Search">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="5">
                                                    <asp:Panel ID="Panel31" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTracking_0" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Sunset" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="entered_by">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                        UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                    <telerik:GridBoundColumn DataField="entered_by" 
                                                                        FilterControlAltText="Filter entered_by column" HeaderText="entered_by" 
                                                                        SortExpression="entered_by" UniqueName="entered_by">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="RETURNED" 
                                                                        FilterControlAltText="Filter RETURNED column" HeaderText="RETURNED" 
                                                                        SortExpression="RETURNED" UniqueName="RETURNED">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="NOT_SUBMITTED" 
                                                                        FilterControlAltText="Filter NOT_SUBMITTED column" HeaderText="NOT_SUBMITTED" 
                                                                        SortExpression="NOT_SUBMITTED" UniqueName="NOT_SUBMITTED">
                                                                    </telerik:GridBoundColumn>     
    
 
<telerik:GridBoundColumn DataField="SUBMITTED" 
FilterControlAltText="Filter SUBMITTED column" HeaderText="SUBMITTED" 
SortExpression="SUBMITTED" UniqueName="SUBMITTED">
</telerik:GridBoundColumn>  
  
<telerik:GridBoundColumn DataField="MEDICAL_VETTING" 
FilterControlAltText="Filter MEDICAL_VETTING column" HeaderText="MEDICAL_VETTING" 
SortExpression="MEDICAL_VETTING" UniqueName="MEDICAL_VETTING">
</telerik:GridBoundColumn>    

<telerik:GridBoundColumn DataField="PRICING_REVIEW" 
FilterControlAltText="Filter PRICING_REVIEW column" HeaderText="PRICING_REVIEW" 
SortExpression="PRICING_REVIEW" UniqueName="PRICING_REVIEW">
</telerik:GridBoundColumn>    

<telerik:GridBoundColumn DataField="MSHIP_UPDATE" 
FilterControlAltText="Filter MSHIP_UPDATE column" HeaderText="MSHIP_UPDATE" 
SortExpression="MSHIP_UPDATE" UniqueName="MSHIP_UPDATE">
</telerik:GridBoundColumn>    

<telerik:GridBoundColumn DataField="AWAITING_RECEIPT" 
FilterControlAltText="Filter AWAITING_RECEIPT column" HeaderText="AWAITING_RECEIPT" 
SortExpression="AWAITING_RECEIPT" UniqueName="AWAITING_RECEIPT">
</telerik:GridBoundColumn>    

<telerik:GridBoundColumn DataField="AWAITING_POLICY" 
FilterControlAltText="Filter AWAITING_POLICY column" HeaderText="AWAITING_POLICY" 
SortExpression="AWAITING_POLICY" UniqueName="AWAITING_POLICY">
</telerik:GridBoundColumn>    

<telerik:GridBoundColumn DataField="POLICY_SIGNIN" 
FilterControlAltText="Filter POLICY_SIGNIN column" HeaderText="POLICY_SIGNIN" 
SortExpression="POLICY_SIGNIN" UniqueName="POLICY_SIGNIN">
</telerik:GridBoundColumn>  

<telerik:GridBoundColumn DataField="AWAITING_DISPACH" 
FilterControlAltText="Filter AWAITING_DISPACH column" HeaderText="AWAITING_DISPACH" 
SortExpression="AWAITING_DISPACH" UniqueName="AWAITING_DISPACH">
</telerik:GridBoundColumn>  


<telerik:GridBoundColumn DataField="CLOSED" 
FilterControlAltText="Filter CLOSED column" HeaderText="CLOSED" 
SortExpression="CLOSED" UniqueName="CLOSED">
</telerik:GridBoundColumn>            
<telerik:GridBoundColumn DataField="IT_SUPPORT" 
FilterControlAltText="Filter IT_SUPPORT column" HeaderText="IT_SUPPORT" 
SortExpression="IT_SUPPORT" UniqueName="IT_SUPPORT">
</telerik:GridBoundColumn>                                                      
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="5">
                                                    <asp:Panel ID="Panel11" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTracking" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Sunset" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                        UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                        <telerik:GridBoundColumn DataField="Receive_dt" 
                                                                        FilterControlAltText="Filter Receive_dt column" HeaderText="Receive_dt" 
                                                                        SortExpression="Receive_dt" UniqueName="Receive_dt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                      <telerik:GridBoundColumn DataField="Premium" 
                                                                        FilterControlAltText="Filter Premium column" HeaderText="Premium" 
                                                                        SortExpression="Premium" UniqueName="Premium">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="eOx_Invoice_No" 
                                                                        FilterControlAltText="Filter eOx_Invoice_No column" HeaderText="Invoice_No" 
                                                                        SortExpression="eOx_Invoice_No" UniqueName="eOx_Invoice_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                        FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                        SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>   
                                                                    <telerik:GridBoundColumn DataField="Business_Type" 
                                                                        FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                        SortExpression="Business_Type" UniqueName="Business_Type">
                                                                    </telerik:GridBoundColumn>                                                   
                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                        FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                        SortExpression="File_Status" UniqueName="File_Status">
                                                                    </telerik:GridBoundColumn>
                                                                       <telerik:GridBoundColumn DataField="Allocated_to" 
                                                                        FilterControlAltText="Filter Allocated_to column" HeaderText="Allocated_to" 
                                                                        SortExpression="Allocated_to" UniqueName="Allocated_to">
                                                                    </telerik:GridBoundColumn>
                                                                
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#666666">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="height: 34px">
                                        <table style="width: 100%">
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label154" runat="server" Text="Entered By"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <asp:Label ID="lblenteredby" runat="server"></asp:Label>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label155" runat="server" Text="updated by"></asp:Label>
                                                </td>
                                                <td>
                                                    <asp:Label ID="lblupdateby" runat="server"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    <telerik:RadButton ID="RadButton1" runat="server" Skin="Simple" 
                                                        Text="Export to Excel">
                                                    </telerik:RadButton>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height: 41px">
                                        &nbsp;<asp:Label ID="lblerr" runat="server" Font-Bold="True" ForeColor="Red" 
                                            Font-Size="Medium"></asp:Label>
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="100%">
                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridBoundColumn DataField="Note_date" 
                                                            FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                            ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                            FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                            ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Note_From" 
                                                            FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                            ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Notes" 
                                                            FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                            SortExpression="Notes" UniqueName="Notes">
                                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <ItemStyle Wrap="False" />
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                                        </td>
                                </tr>
                            </table>
   </asp:Panel>
   </div>
            </ContentTemplate>
       
            </asp:UpdatePanel>
</asp:Content>

