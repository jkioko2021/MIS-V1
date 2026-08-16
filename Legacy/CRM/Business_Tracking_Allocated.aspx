<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Tracking_Allocated.aspx.vb" Inherits="_Default" %>

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
                                            Text="MEMBERSHIP UPDATE-INVOICE" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td style="width: 1025px" align="right">
                                                    <asp:Label ID="Label141" runat="server" Text="Search by"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    <telerik:RadComboBox ID="cbosearch" Runat="server" AllowCustomText="True" 
                                                        AutoPostBack="True" MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Text="Proposer Name" Value="P" />
                                                            <telerik:RadComboBoxItem runat="server" Text="File No." Value="F" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 264px">
                                                    <telerik:RadTextBox ID="txtsearch" Runat="server" Skin="Web20" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Text="Search" Skin="Simple">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Label ID="Label174" runat="server" style="font-weight: 700" 
                                                        Text="Premium Refunds"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel33" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTrackingRef" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="5" Skin="Web20" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="Refund_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                 
                                                                    <telerik:GridBoundColumn DataField="Refund_No" 
                                                                        FilterControlAltText="Filter Receive_dt column" HeaderText="Refund_No" 
                                                                        SortExpression="Refund_No" UniqueName="Refund_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Request_Dt" 
                                                                        FilterControlAltText="Filter Request_Dt column" HeaderText="Request_Dt" 
                                                                        SortExpression="Request_Dt" UniqueName="Request_Dt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Payee_Name" 
                                                                        FilterControlAltText="Filter Payee_Name column" HeaderText="Payee_Name" 
                                                                        SortExpression="Payee_Name" UniqueName="Payee_Name">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Amount_Paid" 
                                                                        FilterControlAltText="Filter Amount_Paid column" HeaderText="Amount_Paid" 
                                                                        SortExpression="Amount_Paid" UniqueName="Amount_Paid">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Refund_Amt" 
                                                                        FilterControlAltText="Filter Refund_Amt column" HeaderText="Refund_Amt" 
                                                                        SortExpression="Refund_Amt" UniqueName="Refund_Amt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Refund_Status" 
                                                                        FilterControlAltText="Filter Refund_Status column" HeaderText="Refund_Status" 
                                                                        SortExpression="Refund_Status" UniqueName="Refund_Status">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Refund_Type" 
                                                                        FilterControlAltText="Filter Refund_Type column" HeaderText="Refund_Type" 
                                                                        SortExpression="Refund_Type" UniqueName="Refund_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Entered_By" 
                                                                        FilterControlAltText="Filter Entered_By column" HeaderText="Entered_By" 
                                                                        SortExpression="Entered_By" UniqueName="Entered_By">
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
                                                <td colspan="4">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Label ID="Label175" runat="server" style="font-weight: 700" 
                                                        Text="Business update"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel11" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTracking" runat="server" AllowPaging="True" ShowFooter="true"
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Web20" 
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
                                                                    <telerik:GridBoundColumn DataField="Allocate_dt" 
                                                                        FilterControlAltText="Filter Allocate_dt column" HeaderText="Allocate_dt" 
                                                                        SortExpression="Allocate_dt" UniqueName="Allocate_dt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
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
                                                                    <telerik:GridBoundColumn DataField="Walk_in_Client" 
                                                                        FilterControlAltText="Filter Walk_in_Client column" HeaderText="Walk_in" 
                                                                        SortExpression="Walk_in_Client" UniqueName="Walk_in_Client">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Lateral_Movement" 
                                                                        FilterControlAltText="Filter Lateral_Movement column" HeaderText="Waiver" 
                                                                        SortExpression="Lateral_Movement" UniqueName="Lateral_Movement">
                                                                    </telerik:GridBoundColumn>
                                                                         <telerik:GridBoundColumn DataField="Product" 
                                                                        FilterControlAltText="Filter Product column" HeaderText="Product" 
                                                                        SortExpression="Product" UniqueName="Product">
                                                                    </telerik:GridBoundColumn>
                                                                           <telerik:GridBoundColumn DataField="Syst" 
                                                                        FilterControlAltText="Filter Syst column" HeaderText="System" 
                                                                        SortExpression="Syst" UniqueName="Syst">
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
                                    <td>
                                        <telerik:RadTabStrip ID="RadTabStrip1" runat="server" 
                                            MultiPageID="RadMultiPage1" SelectedIndex="0" Skin="Web20" Width="100%">
                                            <Tabs>
                                                <telerik:RadTab runat="server" Text="Register" Selected="True" 
                                                    SelectedIndex="0">
                                                </telerik:RadTab>
                                                <telerik:RadTab runat="server" Text="Documentation">
                                                </telerik:RadTab>
                                                <telerik:RadTab runat="server" PageViewID="V3" Text="Payment">
                                                </telerik:RadTab>
                                                <telerik:RadTab runat="server" PageViewID="V4" Text="Online Products">
                                                </telerik:RadTab>
                                                <telerik:RadTab runat="server" Text="Member List" PageViewID="V5">
                                                </telerik:RadTab>
                                            </Tabs>
                                        </telerik:RadTabStrip>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="1100px">
                                            <telerik:RadPageView ID="V1" runat="server" Selected="True">
                                                <asp:Panel ID="Panel16" runat="server">
                                                    <table style="width: 100%">
                                                        <tr>
                                                            <td style="width: 163px;">
                                                                &nbsp;</td>
                                                            <td class="style17" style="width: 431px;">
                                                                &nbsp;</td>
                                                            <td class="style17" style="width: 132px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="4" style="height: 40px">
                                                                <asp:Label ID="Label145" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                                    Text="Proposer Details"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px;">
                                                                &nbsp;</td>
                                                            <td class="style17" style="width: 431px;">
                                                                &nbsp;</td>
                                                            <td class="style17" style="width: 132px">
                                                                <asp:Label ID="Label180" runat="server" Text="Receive Date"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadDatePicker ID="dtreceivedate" Runat="server" Enabled="False" 
                                                                    MinDate="" Skin="Web20">
                                                                    <Calendar Skin="Web20" UseColumnHeadersAsSelectors="False" 
                                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                    </Calendar>
                                                                    <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                    </DateInput>
                                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                </telerik:RadDatePicker>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px;">
                                                                <asp:Label ID="Label181" runat="server" Text="Proposer Name"></asp:Label>
                                                            </td>
                                                            <td class="style17" style="width: 431px;">
                                                                <telerik:RadTextBox ID="txtProposer" Runat="server" Skin="Web20" Width="250px">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                            <td class="style17" style="width: 132px">
                                                                <asp:Label ID="Label194" runat="server" Text="NID"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadTextBox ID="txtNID" Runat="server" Skin="Web20" Width="250px">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px;">
                                                                <asp:Label ID="Label183" runat="server" Text="Client Type"></asp:Label>
                                                            </td>
                                                            <td class="style17" style="width: 431px;">
                                                                <telerik:RadComboBox ID="cboclient" Runat="server" Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboclient" Selected="True" 
                                                                            Text="Retail" Value="R" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="SME" Value="S" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="CORPORATE" Value="C" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td class="style17" style="width: 132px">
                                                                <asp:Label ID="Label195" runat="server" Text="Pin No"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadTextBox ID="txt_PIN" Runat="server" Skin="Web20" Width="250px">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px;">
                                                                <asp:Label ID="Label187" runat="server" Text="Business"></asp:Label>
                                                            </td>
                                                            <td class="style17" style="width: 431px">
                                                                <telerik:RadComboBox ID="cboBUS" Runat="server" Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBUS" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Medical" Value="M" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Non Medical" Value="N" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td class="style17" style="width: 132px">
                                                                <asp:Label ID="Label186" runat="server" Text="County"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadComboBox ID="cboCounty" Runat="server" Skin="Web20" Width="250px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboCounty" Selected="True" 
                                                                            Text="Retail" Value="R" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px;">
                                                                <asp:Label ID="Label191" runat="server" Text="Category"></asp:Label>
                                                            </td>
                                                            <td class="style17" style="width: 431px;">
                                                                <telerik:RadComboBox ID="cbocategory" Runat="server" Skin="Web20" 
                                                                    Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Public" Value="Public" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Private" Value="Private" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td class="style17" style="width: 132px">
                                                                <asp:Label ID="Label192" runat="server" Text="Sector"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadComboBox ID="cboSector" Runat="server" Skin="Web20" Width="250px" 
                                                                    AllowCustomText="True" MarkFirstMatch="True">
                                                                </telerik:RadComboBox>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px;">
                                                                <asp:Label ID="Label185" runat="server" Text="Agent/Broker"></asp:Label>
                                                            </td>
                                                            <td class="style17" style="width: 431px;">
                                                                <telerik:RadComboBox ID="cboagent" Runat="server" AccessibilityMode="True" 
                                                                    AllowCustomText="True" MarkFirstMatch="True" Skin="Web20" Width="300px">
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td class="style17" style="width: 132px;">
                                                                <asp:Label ID="Label182" runat="server" Text="CR12"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadTextBox ID="txtCR12" Runat="server" Skin="Web20" Width="250px">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px;">
                                                                <asp:Label ID="Label193" runat="server" Text="Rate Type"></asp:Label>
                                                            </td>
                                                            <td class="style17" style="width: 431px;">
                                                                <telerik:RadComboBox ID="cborateType" Runat="server" Skin="Web20" 
                                                                    Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cborateType" 
                                                                            Text="Standard Rates" Value="S" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cborateType" Text="Custom Rates" 
                                                                            Value="C" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td class="style17" style="width: 132px;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px; ">
                                                                <asp:Label ID="Label188" runat="server" Text="Business/Action Type"></asp:Label>
                                                            </td>
                                                            <td class="style17" style="width: 431px; ">
                                                                <telerik:RadComboBox ID="cboBusiness" Runat="server" AutoPostBack="True" 
                                                                    MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="New" 
                                                                            Value="N" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Renewal" 
                                                                            Value="R" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Addon" 
                                                                            Value="A" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Termination" 
                                                                            Value="T" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" 
                                                                            Text="Reinstatement" Value="RT" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" 
                                                                            Text="Category Change" Value="CC" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" 
                                                                            Text="Premium Recon" Value="PR" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Nill_Endr" 
                                                                            Value="NE" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Fund_Topup" 
                                                                            Value="FT" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Suspension" 
                                                                            Value="SU" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" 
                                                                            Text="Lift Suspension" Value="LS" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td class="style17" style="width: 132px; ">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px;">
                                                                <asp:Label ID="Label171" runat="server" Text="Card Type"></asp:Label>
                                                            </td>
                                                            <td class="style17" style="width: 431px">
                                                                <telerik:RadComboBox ID="cboCard" Runat="server" MarkFirstMatch="True" 
                                                                    Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboCard" Selected="True" 
                                                                            Text="MTIBA" Value="MTIBA" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="SMART" Value="SMART" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td class="style17" style="width: 132px">
                                                                <asp:Label ID="Label196" runat="server" Text="Benefits Verified"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <asp:Label ID="LBLBEN" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                                    style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px;">
                                                                <asp:Label ID="Label190" runat="server" Text="Payment Mode"></asp:Label>
                                                            </td>
                                                            <td class="style17" style="width: 431px;">
                                                                <telerik:RadComboBox ID="cboPayment0" Runat="server" MarkFirstMatch="True" 
                                                                    Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboPayment" Selected="True" 
                                                                            Text="MPESA" Value="MPESA" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboPayment" Text="EFT" 
                                                                            Value="EFT" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="CHEQ" Value="CHEQ" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="IPF" Value="IPF" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td class="style17" style="width: 132px">
                                                                &nbsp;</td>
                                                            <td>
                                                                <asp:CheckBox ID="chkmedical" runat="server" Enabled="False" 
                                                                    Text="Medical underwriting" />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px; height: 31px;">
                                                                &nbsp;</td>
                                                            <td class="style17" style="width: 431px; height: 31px;">
                                                                <asp:CheckBox ID="chkwaiver" runat="server" Font-Bold="True" Font-Size="Small" 
                                                                    Text="New Waiver-Lateral Movement" />
                                                            </td>
                                                            <td class="style17" style="width: 132px; height: 31px;">
                                                            </td>
                                                            <td style="height: 31px">
                                                                <asp:Label ID="refno" runat="server"></asp:Label>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </asp:Panel>
                                            </telerik:RadPageView>
                                            <telerik:RadPageView ID="V2" runat="server" Width="1144px">
                                                <asp:Panel ID="Panel2" runat="server">
                                                    <table style="width: 99%">
                                                        <tr>
                                                            <td>
                                                                <asp:Label ID="Label147" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Panel ID="Panel30" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1100px">
                                                                    <telerik:RadGrid ID="GD_DOCS" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                        GridLines="None" Height="100%" Skin="Web20" Width="100%">
                                                                        <MasterTableView AutoGenerateColumns="False" DataKeyNames="DOC_ID">
                                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </RowIndicatorColumn>
                                                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </ExpandCollapseColumn>
                                                                            <Columns>
                                                                            
                                                                                <telerik:GridBoundColumn DataField="DOC_ID" 
                                                                                    FilterControlAltText="Filter DOC_ID column" HeaderText="DOC_ID" 
                                                                                    SortExpression="DOC_ID" UniqueName="DOC_ID">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="File_No" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Doc_Title" 
                                                                                    FilterControlAltText="Filter Doc_Title column" HeaderText="Doc_Title" 
                                                                                    SortExpression="Doc_Title" UniqueName="Doc_Title">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Doc_Date" 
                                                                                    FilterControlAltText="Filter Doc_Date column" HeaderText="Doc_Date" 
                                                                                    SortExpression="Doc_Date" UniqueName="Doc_Date">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="File_Name" 
                                                                                    FilterControlAltText="Filter File_Name column" HeaderText="File_Name" 
                                                                                    SortExpression="File_Name" UniqueName="File_Name">
                                                                                </telerik:GridBoundColumn>
                                                                                     <telerik:GridBoundColumn DataField="Doc_Ref" 
                                                                                    FilterControlAltText="Filter Doc_Ref column" HeaderText="Doc_Ref" 
                                                                                    SortExpression="Doc_Ref" UniqueName="Doc_Ref">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Upload_By" 
                                                                                    FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                                    SortExpression="Upload_By" UniqueName="Upload_By">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridTemplateColumn AllowFiltering="false" HeaderText="View" 
                                                                                    SortExpression="DOC_ID">
                   <ItemTemplate>
                  <asp:LinkButton ID="lnkDownload" runat="server" Text="Download" OnClick="DownloadFile"
                    CommandArgument='<%# Eval("DOC_ID") %>'></asp:LinkButton>
                  </ItemTemplate>
                                                                                </telerik:GridTemplateColumn>
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
                                                            <td>
                                                                <asp:Panel ID="Panel13" runat="server" BorderStyle="Solid" Height="100%" 
                                                                    ScrollBars="Horizontal" Width="1071px">
                                                                    <asp:Literal ID="ltEmbed" runat="server" />
                                                                </asp:Panel>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="height: 17px;">
                                                                <asp:Label ID="Label154" runat="server" Text="Benefit Verified"></asp:Label>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </asp:Panel>
                                            </telerik:RadPageView>
                                            <telerik:RadPageView ID="V3" runat="server" Width="1144px">
                                                <asp:Panel ID="Panel39" runat="server">
                                                    <table style="width: 99%">
                                                        <tr>
                                                            <td>
                                                                <asp:Panel ID="Panel40" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1128px">
                                                                    <telerik:RadGrid ID="GD_Pay" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                        GridLines="None" Height="100%" PageSize="20" Skin="Web20" Width="100%">
                                                                        <MasterTableView AutoGenerateColumns="False">
                                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </RowIndicatorColumn>
                                                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </ExpandCollapseColumn>
                                                                            <Columns>
                                                                                <telerik:GridBoundColumn DataField="File_No" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                                    FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                                    SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Client_Type" 
                                                                                    FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                                    SortExpression="Client_Type" UniqueName="Client_Type">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Premium" DataFormatString="{0:### ##0.0}" 
                                                                                    FilterControlAltText="Filter Premium column" HeaderText="Premium" 
                                                                                    SortExpression="Premium" UniqueName="Premium">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Paid_Amt" DataFormatString="{0:### ##0.0}" 
                                                                                    FilterControlAltText="Filter Paid_Amt column" HeaderText="Paid_Amt" 
                                                                                    SortExpression="Paid_Amt" UniqueName="Paid_Amt">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Pay_Ref_No" 
                                                                                    FilterControlAltText="Filter Pay_Ref_No column" HeaderText="Pay_Ref_No" 
                                                                                    SortExpression="Pay_Ref_No" UniqueName="Pay_Ref_No">
                                                                                </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                                    FilterControlAltText="Filter File_Status column" HeaderText="File_Status" 
                                                                                    SortExpression="File_Status" UniqueName="File_Status">
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
                                                            <td>
                                                                <asp:Label ID="Label200" runat="server" Font-Bold="True" Text="Payment Details"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Label ID="Label202" runat="server" Font-Bold="True" Text="Renewal Schedule"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Label ID="Label201" runat="server" Text="Total Paid Amt:"></asp:Label>
                                                                &nbsp;<telerik:RadNumericTextBox ID="txtpaid" Runat="server" Culture="en-US" 
                                                                    Skin="Web20" Value="0" Width="200px">
                                                                </telerik:RadNumericTextBox>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Panel ID="Panel18" runat="server" Height="100%" ScrollBars="Both" Width="1142px">
                                                                    <telerik:RadGrid ID="GD_REN" runat="server" AllowPaging="True" CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Simple" Width="100%">
                                                                        <MasterTableView AutoGenerateColumns="False" DataKeyNames="POLICY_CODE">
                                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </RowIndicatorColumn>
                                                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </ExpandCollapseColumn>
                                                                            <Columns>
                                                                                
                                                                                <telerik:GridBoundColumn DataField="POLICY_CODE" FilterControlAltText="Filter POLICY_CODE column" HeaderText="POLICY_CODE" SortExpression="POLICY_CODE" UniqueName="POLICY_CODE">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="PROPOSER_DISPLAY_NAME" FilterControlAltText="Filter PROPOSER_DISPLAY_NAME column" HeaderText="PROPOSER_DISPLAY_NAME" SortExpression="PROPOSER_DISPLAY_NAME" UniqueName="PROPOSER_DISPLAY_NAME">
                                                                                </telerik:GridBoundColumn>
                                                                               
                                                                                <telerik:GridBoundColumn DataField="FAMILY_NO" FilterControlAltText="Filter FAMILY_NO column" HeaderText="FAMILY_NO" SortExpression="FAMILY_NO" UniqueName="FAMILY_NO">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="PERIOD_FROM" DataFormatString="{0:yyyy-MM-dd}" FilterControlAltText="Filter PERIOD_FROM column" HeaderText="PERIOD_FROM" SortExpression="PERIOD_FROM" UniqueName="PERIOD_FROM">
                                                                                </telerik:GridBoundColumn>
                                                                               
                                                                                <telerik:GridBoundColumn DataField="PERIOD_TO" DataFormatString="{0:yyyy-MM-dd}" FilterControlAltText="Filter PERIOD_TO column" HeaderText="PERIOD_TO" SortExpression="PERIOD_TO" UniqueName="PERIOD_TO">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="TOTAL_PREMIUM" DataFormatString="{0:n}" DataType="System.Decimal" FilterControlAltText="Filter TOTAL_PREMIUM column" HeaderText="TOTAL_PREMIUM" SortExpression="TOTAL_PREMIUM" UniqueName="TOTAL_PREMIUM">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MOBILE_NO" FilterControlAltText="Filter MOBILE_NO column" HeaderText="MOBILE_NO" SortExpression="MOBILE_NO" UniqueName="MOBILE_NO">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridTemplateColumn AllowFiltering="false" HeaderText="View" SortExpression="DOC_ID">
                                                                                    <ItemTemplate>
                                                                                        <asp:LinkButton ID="lnkview" runat="server" CommandArgument='<%# Eval("POLICY_CODE") %>' OnClick="DownloadSchedule" Text="Download"></asp:LinkButton>
                                                                                    </ItemTemplate>
                                                                                </telerik:GridTemplateColumn>
                                                                            </Columns>
                                                                            <EditFormSettings>
                                                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                </EditColumn>
                                                                            </EditFormSettings>
                                                                        </MasterTableView>
                                                                        <ItemStyle Wrap="False" />
                                                                        <PagerStyle Wrap="False" />
                                                                        <FilterMenu EnableImageSprites="False">
                                                                        </FilterMenu>
                                                                        <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                        </HeaderContextMenu>
                                                                    </telerik:RadGrid>
                                                                </asp:Panel>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Panel ID="Panel41" runat="server" Height="100%" ScrollBars="Both" Width="1142px">
                                                                    <telerik:RadGrid ID="GD_REN_1" runat="server" AllowPaging="True" CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Simple" Width="100%">
                                                                        <MasterTableView AutoGenerateColumns="False">
                                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </RowIndicatorColumn>
                                                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </ExpandCollapseColumn>
                                                                            <Columns>
                                                                                <telerik:GridBoundColumn DataField="DISPLAY_MEMBERSHIP_NO" FilterControlAltText="Filter DISPLAY_MEMBERSHIP_NO column" HeaderText="DISPLAY_MEMBERSHIP_NO" SortExpression="DISPLAY_MEMBERSHIP_NO" UniqueName="DISPLAY_MEMBERSHIP_NO">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="MEMBER_NAME" FilterControlAltText="Filter MEMBER_NAME column" HeaderText="MEMBER_NAME" SortExpression="MEMBER_NAME" UniqueName="MEMBER_NAME">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="RELATION" FilterControlAltText="Filter RELATION column" HeaderText="RELATION" SortExpression="RELATION" UniqueName="RELATION">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="SCHEME_NAME" FilterControlAltText="Filter SCHEME_NAME column" HeaderText="SCHEME_NAME" SortExpression="SCHEME_NAME" UniqueName="SCHEME_NAME">
                                                                                </telerik:GridBoundColumn>
                                                                            </Columns>
                                                                            <EditFormSettings>
                                                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                </EditColumn>
                                                                            </EditFormSettings>
                                                                        </MasterTableView>
                                                                        <ItemStyle Wrap="False" />
                                                                        <PagerStyle Wrap="False" />
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
                                            </telerik:RadPageView>
                                              <telerik:RadPageView ID="V4" runat="server" Width="1144px">

                                                  <asp:Panel ID="Panel4" runat="server">
                                                      <table style="width: 99%">
                                                          <tr>
                                                              <td>
                                                                  <asp:Label ID="Label178" runat="server" Font-Bold="True" Text="Proposer"></asp:Label>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td>
                                                                  <asp:Panel ID="Panel36" runat="server" Height="100%" ScrollBars="Both" 
                                                                      Width="1128px">
                                                                      <telerik:RadGrid ID="GD_PROPOSER" runat="server" AllowPaging="True" 
                                                                          CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Outlook" 
                                                                          Width="100%">
                                                                          <MasterTableView AutoGenerateColumns="False">
                                                                              <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                              <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                  <HeaderStyle Width="20px" />
                                                                              </RowIndicatorColumn>
                                                                              <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                  <HeaderStyle Width="20px" />
                                                                              </ExpandCollapseColumn>
                                                                              <Columns>
                                                                                  <telerik:GridBoundColumn DataField="code" 
                                                                                      FilterControlAltText="Filter code column" HeaderText="File_No" 
                                                                                      SortExpression="code" UniqueName="code">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="proposer" 
                                                                                      FilterControlAltText="Filter proposer column" HeaderText="proposer" 
                                                                                      SortExpression="proposer" UniqueName="proposer">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="cover_type" 
                                                                                      FilterControlAltText="Filter cover_type column" HeaderText="cover_type" 
                                                                                      SortExpression="cover_type" UniqueName="cover_type">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="family_size" 
                                                                                      FilterControlAltText="Filter family_size column" HeaderText="family_size" 
                                                                                      SortExpression="family_size" UniqueName="family_size">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="plan_name" 
                                                                                      FilterControlAltText="Filter plan_name column" HeaderText="plan_name" 
                                                                                      SortExpression="plan_name" UniqueName="plan_name">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="plan_limit" 
                                                                                      DataFormatString="{0:###.##0.0}" 
                                                                                      FilterControlAltText="Filter plan_limit column" HeaderText="plan_limit" 
                                                                                      SortExpression="plan_limit" UniqueName="plan_limit">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="age_band" 
                                                                                      FilterControlAltText="Filter age_band column" HeaderText="age_band" 
                                                                                      SortExpression="age_band" UniqueName="age_band">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="premium_amount" 
                                                                                      DataFormatString="{0:### ##0.0}" 
                                                                                      FilterControlAltText="Filter premium_amount column" HeaderText="premium" 
                                                                                      SortExpression="premium_amount" UniqueName="premium_amount">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="levy_vat" 
                                                                                      FilterControlAltText="Filter levy_vat column" HeaderText="levy_vat" 
                                                                                      SortExpression="levy_vat" UniqueName="levy_vat">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="levy_ext" 
                                                                                      FilterControlAltText="Filter levy_ext column" HeaderText="levy_ext" 
                                                                                      SortExpression="levy_ext" UniqueName="levy_ext">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="stamp_duty" 
                                                                                      FilterControlAltText="Filter stamp_duty column" HeaderText="stamp_duty" 
                                                                                      SortExpression="stamp_duty" UniqueName="stamp_duty">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="total_amount" 
                                                                                      DataFormatString="{0:### ##0.0}" 
                                                                                      FilterControlAltText="Filter total_amount column" HeaderText="total_amount" 
                                                                                      SortExpression="total_amount" UniqueName="total_amount">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="agent" 
                                                                                      FilterControlAltText="Filter agent column" HeaderText="agent" 
                                                                                      SortExpression="agent" UniqueName="agent">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="proposer_dob" 
                                                                                      FilterControlAltText="Filter proposer_dob column" HeaderText="proposer_dob" 
                                                                                      SortExpression="proposer_dob" UniqueName="proposer_dob">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="application_date" 
                                                                                      FilterControlAltText="Filter application_date column" 
                                                                                      HeaderText="application_date" SortExpression="application_date" 
                                                                                      UniqueName="application_date">
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
                                                              <td>
                                                                  <asp:Label ID="Label2" runat="server" Font-Bold="True" Text="Members"></asp:Label>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td>
                                                                  <asp:Panel ID="Panel5" runat="server" Height="100%" ScrollBars="Both" 
                                                                      Width="1128px">
                                                                      <telerik:RadGrid ID="GD_MEMBERS" runat="server" AllowPaging="True" 
                                                                          CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Outlook" 
                                                                          Width="100%">
                                                                          <MasterTableView AutoGenerateColumns="False">
                                                                              <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                              <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                  <HeaderStyle Width="20px" />
                                                                              </RowIndicatorColumn>
                                                                              <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                  <HeaderStyle Width="20px" />
                                                                              </ExpandCollapseColumn>
                                                                              <Columns>
                                                                                  <telerik:GridBoundColumn DataField="code" 
                                                                                      FilterControlAltText="Filter code column" HeaderText="File_No" 
                                                                                      SortExpression="code" UniqueName="code">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="relation" 
                                                                                      FilterControlAltText="Filter relation column" HeaderText="relation" 
                                                                                      SortExpression="relation" UniqueName="relation">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="firstname" 
                                                                                      FilterControlAltText="Filter firstname column" HeaderText="firstname" 
                                                                                      SortExpression="firstname" UniqueName="firstname">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="lastname" 
                                                                                      FilterControlAltText="Filter lastname column" HeaderText="lastname" 
                                                                                      SortExpression="lastname" UniqueName="lastname">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="phone" 
                                                                                      FilterControlAltText="Filter phone column" HeaderText="phone" 
                                                                                      SortExpression="phone" UniqueName="phone">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="email" 
                                                                                      FilterControlAltText="Filter email column" HeaderText="email" 
                                                                                      SortExpression="email" UniqueName="email">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="id_number" 
                                                                                      FilterControlAltText="Filter id_number column" HeaderText="id_number" 
                                                                                      SortExpression="id_number" UniqueName="id_number">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="Gender" 
                                                                                      FilterControlAltText="Filter Gender column" HeaderText="Gender" 
                                                                                      SortExpression="Gender" UniqueName="Gender">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="dob" 
                                                                                      FilterControlAltText="Filter dob column" HeaderText="dob" SortExpression="dob" 
                                                                                      UniqueName="dob">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="date_added" 
                                                                                      FilterControlAltText="Filter date_added column" HeaderText="date_added" 
                                                                                      SortExpression="date_added" UniqueName="date_added">
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
                                                              <td>
                                                                  <asp:Label ID="Label179" runat="server" Font-Bold="True" Text="Payment"></asp:Label>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td>
                                                                  <asp:Panel ID="Panel37" runat="server" Height="100%" ScrollBars="Both" 
                                                                      Width="1128px">
                                                                      <telerik:RadGrid ID="GD_Online_Pay" runat="server" AllowPaging="True" 
                                                                          CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Outlook" 
                                                                          Width="100%">
                                                                          <MasterTableView AutoGenerateColumns="False">
                                                                              <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                              <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                  <HeaderStyle Width="20px" />
                                                                              </RowIndicatorColumn>
                                                                              <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                  <HeaderStyle Width="20px" />
                                                                              </ExpandCollapseColumn>
                                                                              <Columns>
                                                                                  <telerik:GridBoundColumn DataField="code" 
                                                                                      FilterControlAltText="Filter code column" HeaderText="File_No" 
                                                                                      SortExpression="code" UniqueName="code">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="payment_code" 
                                                                                      FilterControlAltText="Filter payment_code column" HeaderText="payment_code" 
                                                                                      SortExpression="payment_code" UniqueName="payment_code">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="amount" DataFormatString="{0:### ##0.0}" 
                                                                                      FilterControlAltText="Filter amount column" HeaderText="Paid_Amt" 
                                                                                      SortExpression="amount" UniqueName="amount">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="payment_method" 
                                                                                      FilterControlAltText="Filter payment_method column" HeaderText="payment_method" 
                                                                                      SortExpression="payment_method" UniqueName="payment_method">
                                                                                  </telerik:GridBoundColumn>
                                                                                  <telerik:GridBoundColumn DataField="payment_date" 
                                                                                      FilterControlAltText="Filter payment_date column" HeaderText="payment_date" 
                                                                                      SortExpression="payment_date" UniqueName="payment_date">
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
                                                              <td>
                                                                  <asp:Label ID="Label3" runat="server" Text="Total Paid Amt:"></asp:Label>
                                                                  &nbsp;<telerik:RadNumericTextBox ID="RadNumericTextBox1" Runat="server" 
                                                                      Culture="en-US" Skin="Outlook" Value="0" Width="200px">
                                                                  </telerik:RadNumericTextBox>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td>
                                                                  <telerik:RadButton ID="btnsubmit" runat="server" Skin="Simple" 
                                                                      Text="Export to Excel" Width="200px">
                                                                  </telerik:RadButton>
                                                              </td>
                                                          </tr>
                                                      </table>
                                                  </asp:Panel>

                                            </telerik:RadPageView>  
                                            <telerik:RadPageView ID="V5" runat="server" Width="1144px">

                                                <table style="width: 100%">
                                                    <tr>
                                                        <td>
                                                            <asp:Panel ID="Panel35" runat="server" Height="100%">
                                                                <table style="width: 100%">
                                                                    <tr>
                                                                        <td>
                                                                            <asp:Label ID="Label177" runat="server" style="font-weight: 700" 
                                                                                Text="Client Type"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 271px">
                                                                            <telerik:RadComboBox ID="cbotype" Runat="server" AutoPostBack="True">
                                                                                <Items>
                                                                                    <telerik:RadComboBoxItem runat="server" Owner="cbotype" Text="Retail" 
                                                                                        Value="R" />
                                                                                    <telerik:RadComboBoxItem runat="server" Text="Corporate/SME" Value="C" />
                                                                                </Items>
                                                                            </telerik:RadComboBox>
                                                                        </td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="height: 36px">
                                                                            <asp:Label ID="Label139" runat="server" style="font-weight: 700" Text="Select"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 271px; height: 36px">
                                                                            <telerik:RadComboBox ID="cbosearch_1" Runat="server" AutoPostBack="True">
                                                                                <Items>
                                                                                    <telerik:RadComboBoxItem runat="server" Owner="cbosearch_1" Text="Family Code" 
                                                                                        Value="F" />
                                                                                    <telerik:RadComboBoxItem runat="server" Owner="cbosearch_1" 
                                                                                        Text="Proposer Name" Value="PN" />
                                                                                    <telerik:RadComboBoxItem runat="server" Owner="cbosearch_1" Text="Policy Code" 
                                                                                        Value="PC" />
                                                                                </Items>
                                                                            </telerik:RadComboBox>
                                                                        </td>
                                                                        <td style="height: 36px">
                                                                            <telerik:RadTextBox ID="TXTSEARCH_1" Runat="server" 
                                                                                Skin="Outlook" Width="250px">
                                                                            </telerik:RadTextBox>
                                                                        </td>
                                                                        <td style="height: 36px">
                                                                            <telerik:RadButton ID="cmdview" runat="server" Skin="Simple" Text="View" 
                                                                                Width="157px">
                                                                            </telerik:RadButton>
                                                                        </td>
                                                                        <td style="height: 36px">
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </asp:Panel>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            <asp:Panel ID="Panel12" runat="server" Height="100%" ScrollBars="Both" 
                                                                Width="1142px">
                                                                <telerik:RadGrid ID="GDPROP" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                    GridLines="None" Height="100%" PageSize="20" Skin="Simple" Width="100%">
                                                                    <MasterTableView AutoGenerateColumns="False" DataKeyNames="POLICY_CODE">
                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                        <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                            <HeaderStyle Width="20px" />
                                                                        </RowIndicatorColumn>
                                                                        <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                            <HeaderStyle Width="20px" />
                                                                        </ExpandCollapseColumn>
                                                                        <Columns>
                                                                            <telerik:GridButtonColumn CommandName="Select" 
                                                                                FilterControlAltText="Filter POLICY_CODE column" HeaderText="Select" 
                                                                                Text="Select" UniqueName="Select">
                                                                                <HeaderStyle ForeColor="Blue" Width="50px" />
                                                                                <ItemStyle Width="50px" />
                                                                            </telerik:GridButtonColumn>
                                                                            <telerik:GridBoundColumn DataField="PROPOSER_DISPLAY_NAME" 
                                                                                FilterControlAltText="Filter PROPOSER_DISPLAY_NAME column" 
                                                                                HeaderText="PROPOSER_DISPLAY_NAME" SortExpression="PROPOSER_DISPLAY_NAME" 
                                                                                UniqueName="PROPOSER_DISPLAY_NAME">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="POLICY_CODE" 
                                                                                FilterControlAltText="Filter POLICY_CODE column" HeaderText="POLICY_CODE" 
                                                                                SortExpression="POLICY_CODE" UniqueName="POLICY_CODE">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="PERIOD_FROM" 
                                                                                DataFormatString="{0:yyyy-MM-dd}" 
                                                                                FilterControlAltText="Filter PERIOD_FROM column" HeaderText="PERIOD_FROM" 
                                                                                SortExpression="PERIOD_FROM" UniqueName="PERIOD_FROM">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="PERIOD_TO" 
                                                                                DataFormatString="{0:yyyy-MM-dd}" 
                                                                                FilterControlAltText="Filter PERIOD_TO column" HeaderText="PERIOD_TO" 
                                                                                SortExpression="PERIOD_TO" UniqueName="PERIOD_TO">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="AGENT" 
                                                                                FilterControlAltText="Filter AGENT column" HeaderText="AGENT" 
                                                                                SortExpression="AGENT" UniqueName="AGENT">
                                                                            </telerik:GridBoundColumn>
                                                                        </Columns>
                                                                        <EditFormSettings>
                                                                            <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                            </EditColumn>
                                                                        </EditFormSettings>
                                                                    </MasterTableView>
                                                                    <ItemStyle Wrap="False" />
                                                                    <PagerStyle Wrap="False" />
                                                                    <FilterMenu EnableImageSprites="False">
                                                                    </FilterMenu>
                                                                    <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                    </HeaderContextMenu>
                                                                </telerik:RadGrid>
                                                            </asp:Panel>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            <asp:Panel ID="Panel14" runat="server" Height="100%" ScrollBars="Both" 
                                                                Width="1142px">
                                                                <telerik:RadGrid ID="GDMEM" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                    GridLines="None" Height="100%" PageSize="20" Skin="Simple" Width="100%">
                                                                    <MasterTableView AutoGenerateColumns="False" 
                                                                        DataKeyNames="DISPLAY_MEMBERSHIP_NO">
                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                        <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                            <HeaderStyle Width="20px" />
                                                                        </RowIndicatorColumn>
                                                                        <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                            <HeaderStyle Width="20px" />
                                                                        </ExpandCollapseColumn>
                                                                        <Columns>
                                                                        
                                                                            <telerik:GridBoundColumn DataField="MEMBER_NAME" 
                                                                                FilterControlAltText="Filter MEMBER_NAME column" HeaderText="MEMBER_NAME" 
                                                                                SortExpression="MEMBER_NAME" UniqueName="MEMBER_NAME">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="DISPLAY_MEMBERSHIP_NO" 
                                                                                FilterControlAltText="Filter DISPLAY_MEMBERSHIP_NO column" 
                                                                                HeaderText="MEMBERSHIP_NO" SortExpression="DISPLAY_MEMBERSHIP_NO" 
                                                                                UniqueName="DISPLAY_MEMBERSHIP_NO">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="MEMBER_BIRTH_DATE" 
                                                                                DataFormatString="{0:yyyy-MM-dd}" 
                                                                                FilterControlAltText="Filter MEMBER_BIRTH_DATE column" HeaderText="DOB" 
                                                                                SortExpression="MEMBER_BIRTH_DATE" UniqueName="MEMBER_BIRTH_DATE">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="FIRST_ENROLLMENT_DATE" 
                                                                                DataFormatString="{0:yyyy-MM-dd}" 
                                                                                FilterControlAltText="Filter FIRST_ENROLLMENT_DATE column" HeaderText="JOIN DT" 
                                                                                SortExpression="FIRST_ENROLLMENT_DATE" UniqueName="FIRST_ENROLLMENT_DATE">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="POLICY_VALID_FROM" 
                                                                                DataFormatString="{0:yyyy-MM-dd}" 
                                                                                FilterControlAltText="Filter POLICY_VALID_FROM column" HeaderText="PERIOD_FROM" 
                                                                                SortExpression="POLICY_VALID_FROM" UniqueName="POLICY_VALID_FROM">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="POLICY_VALID_UPTO" 
                                                                                DataFormatString="{0:yyyy-MM-dd}" 
                                                                                FilterControlAltText="Filter POLICY_VALID_UPTO column" HeaderText="PERIOD_TO" 
                                                                                SortExpression="POLICY_VALID_UPTO" UniqueName="POLICY_VALID_UPTO">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="MEMBER_ADMINISTRATIVE_SEX" 
                                                                                FilterControlAltText="Filter MEMBER_ADMINISTRATIVE_SEX column" HeaderText="SEX" 
                                                                                SortExpression="MEMBER_ADMINISTRATIVE_SEX" 
                                                                                UniqueName="MEMBER_ADMINISTRATIVE_SEX">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="RELATION" 
                                                                                FilterControlAltText="Filter RELATION column" HeaderText="RELATION" 
                                                                                SortExpression="RELATION" UniqueName="RELATION">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="SCHEME_NAME" 
                                                                                FilterControlAltText="Filter SCHEME_NAME column" HeaderText="SCHEME_NAME" 
                                                                                SortExpression="SCHEME_NAME" UniqueName="SCHEME_NAME">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="POLICY_STATUS" 
                                                                                FilterControlAltText="Filter POLICY_STATUS column" HeaderText="POLICY_STATUS" 
                                                                                SortExpression="POLICY_STATUS" UniqueName="POLICY_STATUS">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="MEMBER_PRI_MOBILE" 
                                                                                FilterControlAltText="Filter MEMBER_PRI_MOBILE column" HeaderText="MOBILE" 
                                                                                SortExpression="MEMBER_PRI_MOBILE" UniqueName="MEMBER_PRI_MOBILE">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="MEMBER_PRI_EMAIL" 
                                                                                FilterControlAltText="Filter MEMBER_PRI_EMAIL column" HeaderText="EMAIL" 
                                                                                SortExpression="MEMBER_PRI_EMAIL" UniqueName="MEMBER_PRI_EMAIL">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="MEMBER_PRI_EMAIL" 
                                                                                FilterControlAltText="Filter MEMBER_PRI_EMAIL column" HeaderText="EMAIL" 
                                                                                SortExpression="MEMBER_PRI_EMAIL" UniqueName="MEMBER_PRI_EMAIL">
                                                                            </telerik:GridBoundColumn>
                                                                            <telerik:GridBoundColumn DataField="ID_DOC_NO" 
                                                                                FilterControlAltText="Filter ID_DOC_NO column" HeaderText="ID_DOC_NO" 
                                                                                SortExpression="ID_DOC_NO" UniqueName="ID_DOC_NO">
                                                                            </telerik:GridBoundColumn>
                                                                        </Columns>
                                                                        <EditFormSettings>
                                                                            <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                            </EditColumn>
                                                                        </EditFormSettings>
                                                                    </MasterTableView>
                                                                    <ItemStyle Wrap="False" />
                                                                    <PagerStyle Wrap="False" />
                                                                    <FilterMenu EnableImageSprites="False">
                                                                    </FilterMenu>
                                                                    <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                    </HeaderContextMenu>
                                                                </telerik:RadGrid>
                                                            </asp:Panel>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            <telerik:RadButton ID="cmdview_1" runat="server" Skin="Simple" 
                                                                Text="Export To excel" Width="157px">
                                                            </telerik:RadButton>
                                                            <asp:Label ID="LBLID" runat="server" style="font-weight: 700" Visible="False"></asp:Label>
                                                        </td>
                                                    </tr>
                                                </table>

                                             </telerik:RadPageView>  
                                        </telerik:RadMultiPage>
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
                                                    <asp:Label ID="Label156" runat="server" Text="Invoice/Credit Note"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <telerik:RadComboBox ID="cbodoc" Runat="server" MarkFirstMatch="True" 
                                                        Skin="Web20" Width="250px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label153" runat="server" Text="Invoice/Cr No"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadTextBox ID="txtinv" Runat="server" Skin="Web20" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    <asp:FileUpload ID="FL1" runat="server" Width="330px" />
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label157" runat="server" Text="Amount"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadNumericTextBox ID="txtamount" Runat="server" Culture="en-US" 
                                                        Skin="Web20" Value="0" Width="200px">
                                                    </telerik:RadNumericTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px; height: 16px;">
                                                    </td>
                                                <td style="width: 246px; height: 16px;">
                                                </td>
                                                <td style="height: 16px">
                                                    <asp:Label ID="Label158" runat="server" Text="Policy Code"></asp:Label>
                                                </td>
                                                <td style="height: 16px">
                                                    <telerik:RadTextBox ID="txtpolicy" Runat="server" Skin="Web20" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">&nbsp;</td>
                                                <td style="width: 246px">&nbsp;</td>
                                                <td>
                                                    <asp:Label ID="Label197" runat="server" Text="AML Risk Rate"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadComboBox ID="cboRate" Runat="server" AllowCustomText="True" Skin="Web20">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboRate" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboRate" Text="Low" Value="Low" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboRate" Text="Medium" Value="Medium" />
                                                            <telerik:RadComboBoxItem runat="server" Text="High" Value="High" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">&nbsp;</td>
                                                <td style="width: 246px">&nbsp;</td>
                                                <td>
                                                    <asp:Label ID="Label198" runat="server" Text="Rating Reason"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadComboBox ID="cboRiskReason" Runat="server" MarkFirstMatch="True" Skin="Web20" Width="250px">
                                                    </telerik:RadComboBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">&nbsp;</td>
                                                <td style="width: 246px">
                                                    <asp:Label ID="lblupload" runat="server" Font-Size="Medium"></asp:Label>
                                                </td>
                                                <td>&nbsp;</td>
                                                <td>
                                                    <telerik:RadButton ID="btnupload" runat="server" Skin="Simple" Text="Upload">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <hr />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label155" runat="server" Text="Payment"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <telerik:RadComboBox ID="cbopayment" Runat="server" MarkFirstMatch="True" 
                                                        Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="cbopayment" Text="FULL-PAID" 
                                                                Value="FULL-PAID" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cbopayment" Text="PART-PAID" 
                                                                Value="PART-PAID" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cbopayment" Text="NOT-PAID" 
                                                                Value="NOT-PAID" />
                                                            <telerik:RadComboBoxItem runat="server" Text="CREDIT NOTE" Value="CR" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label150" runat="server" Text="Action"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <telerik:RadComboBox ID="cboAction" Runat="server" AllowCustomText="True" MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboAction" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboAction" Text="Cashier" 
                                                                Value="C" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Medical UW" Value="MU" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Closed" Value="CL" />
                                                            <telerik:RadComboBoxItem runat="server" Text="IT Support" Value="IT" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Return-Incomplete" Value="RI" />
                                                            <telerik:RadComboBoxItem runat="server" Text="RM" Value="RM" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label151" runat="server" Text="Forward to" Visible="False"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadComboBox ID="cboAllocateto" Runat="server" AllowCustomText="True" AutoPostBack="True" MarkFirstMatch="True" Skin="Web20" Visible="False" Width="190px">
                                                    </telerik:RadComboBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label152" runat="server" Text="Entered By"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <asp:Label ID="lblenteredby" runat="server"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label144" runat="server" Text="Notes"></asp:Label>
                                                </td>
                                                <td rowspan="2">
                                                    <telerik:RadTextBox ID="txtcomment" Runat="server" Height="50px" Skin="Web20" 
                                                        TextMode="MultiLine" Width="450px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td colspan="2">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td colspan="2">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px; height: 38px;">
                                                </td>
                                                <td style="height: 38px;">
                                                    <telerik:RadButton ID="btnforward" runat="server" Skin="Simple" Text="Forward " 
                                                        Width="200px">
                                                    </telerik:RadButton>
                                                </td>
                                                <td colspan="2" style="height: 38px">
                                                </td>
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
                                                GridLines="None" Height="100%" Skin="Web20" Width="100%">
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
                                                            <ItemStyle Width="150px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                            FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                            ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                            <ItemStyle Width="100px" />
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
                                                <ItemStyle Wrap="True" />
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
                 <Triggers>
        <asp:PostBackTrigger ControlID = "btnupload" />
          </Triggers>
            </asp:UpdatePanel>
</asp:Content>

